package pkgload_scanner

import (
	"os/exec"
	"strconv"
	"strings"

	"github.com/pkg/errors"
	"github.com/vmware-tanzu/cloud-native-security-inspector/cnsi-inspector/pkg/pkgload-scanner/proc"
	"github.com/vmware-tanzu/cloud-native-security-inspector/lib/log"
)

// Define a struct to hold the parsed fields
type Lsof struct {
	Command string
	PID     string
	User    string
	FD      string
	Type    string
	Device  string
	Size    string
	Node    string
	Name    string
}

type LsofInfo struct {
	// from lsof
	Command string
	PID     string
	UID     string
	User    string
	Name    []string

	// from proc tool
	ContainerID string
}

func lsofScan() ([]LsofInfo, error) {
	//fmt.Println("lsofscanner is running...")

	// Run lsof command and filter by .so files
	cmd := exec.Command("lsof")
	//cmd.Args = append(cmd.Args, "-d", `mem | grep \.so`)
	cmd.Args = append(cmd.Args, `-d`, `mem`, `-F`, `pcLun`)
	output, err := cmd.Output()
	if err != nil {
		log.Error(err, "running lsof command")
		return nil, err
	}

	// Parse lsof output
	lines := strings.Split(string(output), "\n")
	curIndex := -1
	var lsofs []LsofInfo
	for _, line := range lines {
		if len(line) == 0 {
			continue
		}
		switch line[0] {
		case 'p':
			curIndex++
			lsofs = append(lsofs, LsofInfo{})
			lsofs[curIndex].PID = line[1:]
		case 'c':
			lsofs[curIndex].Command = line[1:]
		case 'u':
			lsofs[curIndex].UID = line[1:]
		case 'L':
			lsofs[curIndex].User = line[1:]
		case 'n':
			// check .so
			if !strings.Contains(line[1:], ".so") {
				continue
			}
			lsofs[curIndex].Name = append(lsofs[curIndex].Name, strings.Split(line[1:], " ")[0])
		}
	}

	procTool := proc.NewProcTool(proc.SetMountPoint("/proc"))
	for i, lsof := range lsofs {
		pidInt, err := strconv.Atoi(lsof.PID)
		if err != nil {
			log.Error(err, "Error parsing pid: ", lsof.PID)
			continue
		}
		// Check containerID
		containerID, err := procTool.GetContainerFromPID(pidInt)
		if err != nil {
			if !errors.Is(err, proc.ErrNoContainerFoundForPID) {
				log.Error(err, "GetContainerFromPID")
			}
			continue
		}

		lsofs[i].ContainerID = containerID
		//fmt.Printf("get containerid:%s, command:%s, pid:%s, name:%s\n", containerID, lsof.Command, lsof.PID, lsof.Name)
	}

	return lsofs, nil // TODO: return lsof rich
}

//lsof:   ID    field description
//         a    access: r = read; w = write; u = read/write
//         c    command name
//         d    device character code
//         D    major/minor device number as 0x<hex>
//         f    file descriptor
//         G    file flaGs
//         i    inode number
//         k    link count
//         K    task ID (TID)
//         l    lock: r/R = read; w/W = write; u = read/write
//         L    login name
//         m    marker between repeated output
//         M    task comMand name
//         n    comment, name, Internet addresses
//         o    file offset as 0t<dec> or 0x<hex>
//         p    process ID (PID)
//         g    process group ID (PGID)
//         P    protocol name
//         r    raw device number as 0x<hex>
//         R    paRent PID
//         s    file size
//         S    stream module and device names
//         t    file type
//         T    TCP/TPI info
//         u    user ID (UID)
//         0    (zero) use NUL field terminator instead of NL
